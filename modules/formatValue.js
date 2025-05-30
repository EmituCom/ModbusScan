function formatValue(data, format, unit = '') {
        if (!data) return '{grey-fg}N/A{/}';
        const unitSuffix = unit ? ` ${unit}` : '';
        format = format.toLowerCase();
    
        try {
            if (format === 'bool') {
                return data.data[0] ? '{green-fg}ON{/}' : '{red-fg}OFF{/}';
            }
            if (!data.buffer || data.buffer.length < 2) {
                return '{yellow-fg}Short Buffer{/}';
            }
            const buffer = data.buffer;
            switch (format) {
                case 'int16be':
                    return buffer.readInt16BE(0) + unitSuffix;
                case 'uint16be':
                    return buffer.readUInt16BE(0) + unitSuffix;
                case 'int16le':
                    return buffer.readInt16LE(0) + unitSuffix;
                case 'uint16le':
                    return buffer.readUInt16LE(0) + unitSuffix;
                case 'int16':
                    return buffer.readInt16BE(0) + unitSuffix;
                case 'uint16':
                    return buffer.readUInt16BE(0) + unitSuffix;
                case 'int32be':
                    return buffer.length >= 4 ? buffer.readInt32BE(0) + unitSuffix : '{yellow-fg}Need 2 Regs{/}';
                case 'uint32be':
                    return buffer.length >= 4 ? buffer.readUInt32BE(0) + unitSuffix : '{yellow-fg}Need 2 Regs{/}';
                case 'int32le':
                    return buffer.length >= 4 ? buffer.readInt32LE(0) + unitSuffix : '{yellow-fg}Need 2 Regs{/}';
                case 'uint32le':
                    return buffer.length >= 4 ? buffer.readUInt32LE(0) + unitSuffix : '{yellow-fg}Need 2 Regs{/}';
                case 'float32be':
                    return buffer.length >= 4 ? buffer.readFloatBE(0).toFixed(2) + unitSuffix : '{yellow-fg}Need 2 Regs{/}';
                case 'float32le':
                    return buffer.length >= 4 ? buffer.readFloatLE(0).toFixed(2) + unitSuffix : '{yellow-fg}Need 2 Regs{/}';
                case 'hex':
                    return buffer.toString('hex') + unitSuffix;
                case 'binary':
                    return buffer.toString('binary') + unitSuffix;
                default:
                    return `Unsupported format: ${format}`;
            }
        } catch (e) {
            return '{red-fg}Format Err{/}';
        }
    }

module.exports = formatValue;